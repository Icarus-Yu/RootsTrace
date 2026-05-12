package com.genealogy.controller;

import com.genealogy.common.Result;
import com.genealogy.dto.response.MemberNodeVO;
import com.genealogy.dto.response.RelationEdgeVO;
import com.genealogy.entity.Member;
import com.genealogy.mapper.MemberMapper;
import com.genealogy.mapper.RelationMapper;
import com.genealogy.security.AuthUserPrincipal;
import com.genealogy.service.AuthContextService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/query")
public class QueryController {

    private final RelationMapper relationMapper;
    private final MemberMapper memberMapper;
    private final AuthContextService authContextService;

    public QueryController(
            RelationMapper relationMapper,
            MemberMapper memberMapper,
            AuthContextService authContextService) {
        this.relationMapper = relationMapper;
        this.memberMapper = memberMapper;
        this.authContextService = authContextService;
    }

    @GetMapping("/ancestors/{memberId}")
    public Result<List<MemberNodeVO>> getAncestors(@PathVariable Long memberId, Authentication authentication) {
        Result<Member> accessCheck = validateMemberAccess(memberId, authentication);
        if (accessCheck.getCode() != 200) {
            return Result.error(accessCheck.getCode(), accessCheck.getMessage());
        }
        return Result.success(relationMapper.findAllAncestors(memberId));
    }

    @GetMapping("/descendants/{memberId}")
    public Result<List<MemberNodeVO>> getDescendants(@PathVariable Long memberId, 
                                                     @RequestParam(defaultValue = "10") int depth,
                                                     Authentication authentication) {
        Result<Member> accessCheck = validateMemberAccess(memberId, authentication);
        if (accessCheck.getCode() != 200) {
            return Result.error(accessCheck.getCode(), accessCheck.getMessage());
        }
        int safeDepth = Math.min(Math.max(depth, 1), 100);
        return Result.success(relationMapper.findAllDescendants(memberId, safeDepth));
    }

    @GetMapping("/kinship")
    public Result<RelationEdgeVO> getKinshipPath(@RequestParam Long familyId,
                                                 @RequestParam Long a,
                                                 @RequestParam Long b,
                                                 Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }
        if (!authContextService.canAccessFamily(familyId, currentUser)) {
            return Result.error(403, "无权查询该族谱关系");
        }
        Member memberA = memberMapper.selectById(a);
        Member memberB = memberMapper.selectById(b);
        if (memberA == null || memberB == null) {
            return Result.error(404, "成员不存在");
        }
        if (!familyId.equals(memberA.getFamilyId()) || !familyId.equals(memberB.getFamilyId())) {
            return Result.error(400, "查询成员必须属于指定族谱");
        }
        return Result.success(relationMapper.findKinshipPath(familyId, a, b));
    }

    private Result<Member> validateMemberAccess(Long memberId, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            return Result.error(404, "成员不存在");
        }
        if (!authContextService.canAccessFamily(member.getFamilyId(), currentUser)) {
            return Result.error(403, "无权查询该成员关系");
        }
        return Result.success(member);
    }
}
