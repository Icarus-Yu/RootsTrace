package com.genealogy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.genealogy.common.Result;
import com.genealogy.dto.request.AddCollaboratorRequest;
import com.genealogy.dto.request.CreateFamilyRequest;
import com.genealogy.dto.request.UpdateFamilyRequest;
import com.genealogy.entity.Family;
import com.genealogy.entity.FamilyCollaborator;
import com.genealogy.entity.User;
import com.genealogy.mapper.FamilyCollaboratorMapper;
import com.genealogy.mapper.FamilyMapper;
import com.genealogy.mapper.UserMapper;
import com.genealogy.security.AuthUserPrincipal;
import com.genealogy.service.AuthContextService;
import jakarta.validation.Valid;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/families")
public class FamilyController {

    private final FamilyMapper familyMapper;
    private final FamilyCollaboratorMapper familyCollaboratorMapper;
    private final UserMapper userMapper;
    private final AuthContextService authContextService;

    public FamilyController(
            FamilyMapper familyMapper,
            FamilyCollaboratorMapper familyCollaboratorMapper,
            UserMapper userMapper,
            AuthContextService authContextService) {
        this.familyMapper = familyMapper;
        this.familyCollaboratorMapper = familyCollaboratorMapper;
        this.userMapper = userMapper;
        this.authContextService = authContextService;
    }

    @GetMapping
    public Result<List<Family>> listMyFamilies(Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        List<Family> ownedFamilies = familyMapper.selectList(new LambdaQueryWrapper<Family>()
                .eq(Family::getOwnerId, currentUser.getId())
                .isNull(Family::getDeletedAt)
                .orderByDesc(Family::getCreatedAt));

        List<FamilyCollaborator> collaborations = familyCollaboratorMapper.selectList(
                new LambdaQueryWrapper<FamilyCollaborator>()
                        .eq(FamilyCollaborator::getUserId, currentUser.getId()));
        Set<Long> familyIds = new LinkedHashSet<>();
        ownedFamilies.forEach(family -> familyIds.add(family.getId()));
        collaborations.forEach(collaboration -> familyIds.add(collaboration.getFamilyId()));

        List<Family> families = new ArrayList<>();
        if (!familyIds.isEmpty()) {
            families = familyMapper.selectList(new LambdaQueryWrapper<Family>()
                    .in(Family::getId, familyIds)
                    .isNull(Family::getDeletedAt)
                    .orderByDesc(Family::getCreatedAt));
        }

        return Result.success(families);
    }

    @PostMapping
    public Result<Family> createFamily(@Valid @RequestBody CreateFamilyRequest request, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Family family = new Family();
        family.setName(request.getName().trim());
        family.setSurname(trimToNull(request.getSurname()));
        family.setCompiledAt(request.getCompiledAt());
        family.setOwnerId(currentUser.getId());

        familyMapper.insert(family);
        return Result.success(family);
    }

    @GetMapping("/{id}")
    public Result<Family> getFamily(@PathVariable Long id, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Family family = authContextService.findActiveFamily(id);
        if (family == null) {
            return Result.error(404, "族谱不存在");
        }
        if (!authContextService.canAccessFamily(id, currentUser)) {
            return Result.error(403, "无权访问该族谱");
        }

        return Result.success(family);
    }

    @PutMapping("/{id}")
    public Result<Family> updateFamily(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFamilyRequest request,
            Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Family family = authContextService.findActiveFamily(id);
        if (family == null) {
            return Result.error(404, "族谱不存在");
        }
        if (!family.getOwnerId().equals(currentUser.getId())) {
            return Result.error(403, "无权修改该族谱");
        }

        family.setName(request.getName().trim());
        family.setSurname(trimToNull(request.getSurname()));
        family.setCompiledAt(request.getCompiledAt());
        family.setUpdatedAt(OffsetDateTime.now());

        familyMapper.updateById(family);
        return Result.success(family);
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> deleteFamily(@PathVariable Long id, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Family family = authContextService.findActiveFamily(id);
        if (family == null) {
            return Result.error(404, "族谱不存在");
        }
        if (!family.getOwnerId().equals(currentUser.getId())) {
            return Result.error(403, "无权删除该族谱");
        }

        OffsetDateTime now = OffsetDateTime.now();
        family.setDeletedAt(now);
        family.setUpdatedAt(now);
        familyMapper.updateById(family);

        return Result.success(true);
    }

    @PostMapping("/{id}/collaborators")
    public Result<Boolean> addCollaborator(
            @PathVariable Long id,
            @Valid @RequestBody AddCollaboratorRequest request,
            Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }
        Family family = authContextService.findActiveFamily(id);
        if (family == null) {
            return Result.error(404, "族谱不存在");
        }
        if (!family.getOwnerId().equals(currentUser.getId())) {
            return Result.error(403, "只有族谱创建者可以邀请协作者");
        }

        String account = request.getAccount().trim();
        User collaborator = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, account)
                .or()
                .eq(User::getEmail, account.toLowerCase())
                .last("LIMIT 1"));
        if (collaborator == null) {
            return Result.error(404, "协作者用户不存在");
        }
        if (family.getOwnerId().equals(collaborator.getId())) {
            return Result.error(400, "族谱创建者无需添加为协作者");
        }

        FamilyCollaborator familyCollaborator = new FamilyCollaborator();
        familyCollaborator.setFamilyId(id);
        familyCollaborator.setUserId(collaborator.getId());
        try {
            familyCollaboratorMapper.insert(familyCollaborator);
        } catch (DuplicateKeyException e) {
            return Result.error(400, "该用户已是协作者");
        }

        return Result.success(true);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
