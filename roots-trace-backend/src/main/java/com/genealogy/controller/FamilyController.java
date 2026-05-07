package com.genealogy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.genealogy.common.Result;
import com.genealogy.dto.request.CreateFamilyRequest;
import com.genealogy.entity.Family;
import com.genealogy.mapper.FamilyMapper;
import com.genealogy.security.AuthUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/families")
public class FamilyController {

    private final FamilyMapper familyMapper;

    public FamilyController(FamilyMapper familyMapper) {
        this.familyMapper = familyMapper;
    }

    @GetMapping
    public Result<List<Family>> listMyFamilies(Authentication authentication) {
        AuthUserPrincipal currentUser = getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }

        List<Family> families = familyMapper.selectList(new LambdaQueryWrapper<Family>()
                .eq(Family::getOwnerId, currentUser.getId())
                .isNull(Family::getDeletedAt)
                .orderByDesc(Family::getCreatedAt));

        return Result.success(families);
    }

    @PostMapping
    public Result<Family> createFamily(@Valid @RequestBody CreateFamilyRequest request, Authentication authentication) {
        AuthUserPrincipal currentUser = getCurrentUser(authentication);
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

    private AuthUserPrincipal getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserPrincipal principal)) {
            return null;
        }
        return principal;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
