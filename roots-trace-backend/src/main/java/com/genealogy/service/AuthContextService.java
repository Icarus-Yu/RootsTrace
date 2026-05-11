package com.genealogy.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.genealogy.entity.Family;
import com.genealogy.mapper.FamilyMapper;
import com.genealogy.security.AuthUserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthContextService {

    private final FamilyMapper familyMapper;

    public AuthContextService(FamilyMapper familyMapper) {
        this.familyMapper = familyMapper;
    }

    public AuthUserPrincipal getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserPrincipal principal)) {
            return null;
        }
        return principal;
    }

    public Family findActiveFamily(Long familyId) {
        return familyMapper.selectOne(new LambdaQueryWrapper<Family>()
                .eq(Family::getId, familyId)
                .isNull(Family::getDeletedAt)
                .last("LIMIT 1"));
    }

    public boolean canAccessFamily(Long familyId, AuthUserPrincipal currentUser) {
        Family family = findActiveFamily(familyId);
        return family != null && family.getOwnerId().equals(currentUser.getId());
    }
}
