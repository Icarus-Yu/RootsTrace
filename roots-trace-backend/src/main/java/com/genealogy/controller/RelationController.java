package com.genealogy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.genealogy.common.Result;
import com.genealogy.dto.request.CreateRelationRequest;
import com.genealogy.entity.Member;
import com.genealogy.entity.Relation;
import com.genealogy.mapper.MemberMapper;
import com.genealogy.mapper.RelationMapper;
import com.genealogy.security.AuthUserPrincipal;
import com.genealogy.service.AuthContextService;
import jakarta.validation.Valid;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/relations")
public class RelationController {

    private static final Set<String> PARENT_RELATION_TYPES = Set.of(
            "PARENT_SON", "PARENT_DAUGHTER", "MOTHER_SON", "MOTHER_DAUGHTER"
    );

    private final RelationMapper relationMapper;
    private final MemberMapper memberMapper;
    private final AuthContextService authContextService;

    public RelationController(
            RelationMapper relationMapper,
            MemberMapper memberMapper,
            AuthContextService authContextService) {
        this.relationMapper = relationMapper;
        this.memberMapper = memberMapper;
        this.authContextService = authContextService;
    }

    @PostMapping
    public Result<Relation> createRelation(
            @Valid @RequestBody CreateRelationRequest request,
            Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }
        if (!authContextService.canAccessFamily(request.getFamilyId(), currentUser)) {
            return Result.error(403, "无权操作该族谱关系");
        }
        if (request.getFromMemberId().equals(request.getToMemberId())) {
            return Result.error(400, "不能为同一个成员创建关系");
        }

        Member fromMember = memberMapper.selectById(request.getFromMemberId());
        Member toMember = memberMapper.selectById(request.getToMemberId());
        if (fromMember == null || toMember == null) {
            return Result.error(404, "成员不存在");
        }
        if (!request.getFamilyId().equals(fromMember.getFamilyId())
                || !request.getFamilyId().equals(toMember.getFamilyId())) {
            return Result.error(400, "关系两端成员必须属于同一族谱");
        }

        if (isParentRelation(request.getRelationType())) {
            Result<Relation> validation = validateParentRelation(request, fromMember, toMember);
            if (validation != null) {
                return validation;
            }
        }

        Relation relation = buildRelation(
                request.getFamilyId(),
                request.getFromMemberId(),
                request.getToMemberId(),
                request.getRelationType());

        try {
            relationMapper.insert(relation);
            if ("SPOUSE".equals(request.getRelationType())) {
                insertSpouseReverseIfAbsent(request);
            }
        } catch (DuplicateKeyException e) {
            return Result.error(400, "关系已存在");
        }

        return Result.success(relation);
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> deleteRelation(@PathVariable Long id, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Relation relation = relationMapper.selectById(id);
        if (relation == null) {
            return Result.error(404, "关系不存在");
        }
        if (!authContextService.canAccessFamily(relation.getFamilyId(), currentUser)) {
            return Result.error(403, "无权删除该关系");
        }

        relationMapper.deleteById(id);
        if ("SPOUSE".equals(relation.getRelationType())) {
            relationMapper.delete(new LambdaQueryWrapper<Relation>()
                    .eq(Relation::getFamilyId, relation.getFamilyId())
                    .eq(Relation::getFromMemberId, relation.getToMemberId())
                    .eq(Relation::getToMemberId, relation.getFromMemberId())
                    .eq(Relation::getRelationType, "SPOUSE"));
        }

        return Result.success(true);
    }

    private Result<Relation> validateParentRelation(
            CreateRelationRequest request,
            Member parent,
            Member child) {
        if (parent.getBirthYear() != null && child.getBirthYear() != null
                && parent.getBirthYear() >= child.getBirthYear()) {
            return Result.error(400, "父母出生年份必须早于子女");
        }
        if (wouldCreateCycle(request.getFamilyId(), request.getToMemberId(), request.getFromMemberId(), new HashSet<>())) {
            return Result.error(400, "该关系会造成血缘环路");
        }
        return null;
    }

    private boolean wouldCreateCycle(Long familyId, Long startMemberId, Long targetMemberId, Set<Long> visited) {
        if (!visited.add(startMemberId)) {
            return false;
        }

        List<Relation> outgoingRelations = relationMapper.selectList(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getFamilyId, familyId)
                .eq(Relation::getFromMemberId, startMemberId)
                .in(Relation::getRelationType, PARENT_RELATION_TYPES));

        for (Relation relation : outgoingRelations) {
            if (relation.getToMemberId().equals(targetMemberId)) {
                return true;
            }
            if (wouldCreateCycle(familyId, relation.getToMemberId(), targetMemberId, visited)) {
                return true;
            }
        }
        return false;
    }

    private void insertSpouseReverseIfAbsent(CreateRelationRequest request) {
        Long count = relationMapper.selectCount(new LambdaQueryWrapper<Relation>()
                .eq(Relation::getFamilyId, request.getFamilyId())
                .eq(Relation::getFromMemberId, request.getToMemberId())
                .eq(Relation::getToMemberId, request.getFromMemberId())
                .eq(Relation::getRelationType, "SPOUSE"));
        if (count == 0) {
            Relation reverse = buildRelation(
                    request.getFamilyId(),
                    request.getToMemberId(),
                    request.getFromMemberId(),
                    "SPOUSE");
            relationMapper.insert(reverse);
        }
    }

    private Relation buildRelation(Long familyId, Long fromMemberId, Long toMemberId, String relationType) {
        Relation relation = new Relation();
        relation.setFamilyId(familyId);
        relation.setFromMemberId(fromMemberId);
        relation.setToMemberId(toMemberId);
        relation.setRelationType(relationType);
        return relation;
    }

    private boolean isParentRelation(String relationType) {
        return PARENT_RELATION_TYPES.contains(relationType);
    }
}
