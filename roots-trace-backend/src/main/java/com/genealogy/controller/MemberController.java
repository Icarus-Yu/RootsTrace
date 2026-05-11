package com.genealogy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.genealogy.common.Result;
import com.genealogy.dto.request.CreateMemberRequest;
import com.genealogy.dto.request.UpdateMemberRequest;
import com.genealogy.entity.Member;
import com.genealogy.mapper.MemberMapper;
import com.genealogy.security.AuthUserPrincipal;
import com.genealogy.service.AuthContextService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberMapper memberMapper;
    private final AuthContextService authContextService;

    public MemberController(MemberMapper memberMapper, AuthContextService authContextService) {
        this.memberMapper = memberMapper;
        this.authContextService = authContextService;
    }

    @GetMapping("/family/{familyId}")
    public Result<IPage<Member>> getMembersByFamily(
            @PathVariable Long familyId,
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long size,
            @RequestParam(required = false) String keyword,
            Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }
        if (!authContextService.canAccessFamily(familyId, currentUser)) {
            return Result.error(403, "无权访问该族谱成员");
        }

        long safePage = Math.max(page, 1);
        long safeSize = Math.min(Math.max(size, 1), 100);
        LambdaQueryWrapper<Member> query = new LambdaQueryWrapper<Member>()
                .eq(Member::getFamilyId, familyId)
                .orderByAsc(Member::getGeneration)
                .orderByAsc(Member::getId);

        String trimmedKeyword = trimToNull(keyword);
        if (trimmedKeyword != null) {
            query.like(Member::getName, trimmedKeyword);
        }

        return Result.success(memberMapper.selectPage(new Page<>(safePage, safeSize), query));
    }

    @GetMapping("/{id}")
    public Result<Member> getMember(@PathVariable Long id, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Member member = memberMapper.selectById(id);
        if (member == null) {
            return Result.error(404, "成员不存在");
        }
        if (!authContextService.canAccessFamily(member.getFamilyId(), currentUser)) {
            return Result.error(403, "无权访问该成员");
        }

        return Result.success(member);
    }
    
    @PostMapping
    public Result<Member> addMember(@Valid @RequestBody CreateMemberRequest request, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }
        if (!authContextService.canAccessFamily(request.getFamilyId(), currentUser)) {
            return Result.error(403, "无权在该族谱中新增成员");
        }
        Result<Member> yearCheck = validateYears(request.getBirthYear(), request.getDeathYear());
        if (yearCheck != null) {
            return yearCheck;
        }

        Member member = new Member();
        member.setFamilyId(request.getFamilyId());
        member.setName(request.getName().trim());
        member.setGender(request.getGender());
        member.setBirthYear(request.getBirthYear());
        member.setDeathYear(request.getDeathYear());
        member.setBio(trimToNull(request.getBio()));
        member.setGeneration(request.getGeneration());
        member.setCreatedBy(currentUser.getId());

        memberMapper.insert(member);
        return Result.success(member);
    }

    @PutMapping("/{id}")
    public Result<Member> updateMember(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMemberRequest request,
            Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Member member = memberMapper.selectById(id);
        if (member == null) {
            return Result.error(404, "成员不存在");
        }
        if (!authContextService.canAccessFamily(member.getFamilyId(), currentUser)) {
            return Result.error(403, "无权修改该成员");
        }
        Result<Member> yearCheck = validateYears(request.getBirthYear(), request.getDeathYear());
        if (yearCheck != null) {
            return yearCheck;
        }

        member.setName(request.getName().trim());
        member.setGender(request.getGender());
        member.setBirthYear(request.getBirthYear());
        member.setDeathYear(request.getDeathYear());
        member.setBio(trimToNull(request.getBio()));
        member.setGeneration(request.getGeneration());
        member.setUpdatedAt(OffsetDateTime.now());

        memberMapper.updateById(member);
        return Result.success(member);
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> deleteMember(@PathVariable Long id, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        Member member = memberMapper.selectById(id);
        if (member == null) {
            return Result.error(404, "成员不存在");
        }
        if (!authContextService.canAccessFamily(member.getFamilyId(), currentUser)) {
            return Result.error(403, "无权删除该成员");
        }

        memberMapper.deleteById(id);
        return Result.success(true);
    }

    private Result<Member> validateYears(Integer birthYear, Integer deathYear) {
        if (birthYear != null && deathYear != null && deathYear < birthYear) {
            return Result.error(400, "死亡年份不能早于出生年份");
        }
        return null;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
