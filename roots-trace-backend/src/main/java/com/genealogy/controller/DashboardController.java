package com.genealogy.controller;

import com.genealogy.common.Result;
import com.genealogy.dto.response.DashboardVO;
import com.genealogy.dto.response.LifespanStatVO;
import com.genealogy.entity.Family;
import com.genealogy.mapper.DashboardMapper;
import com.genealogy.security.AuthUserPrincipal;
import com.genealogy.service.AuthContextService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/families/{familyId}/dashboard")
public class DashboardController {

    private final DashboardMapper dashboardMapper;
    private final AuthContextService authContextService;

    public DashboardController(DashboardMapper dashboardMapper, AuthContextService authContextService) {
        this.dashboardMapper = dashboardMapper;
        this.authContextService = authContextService;
    }

    @GetMapping
    public Result<DashboardVO> getDashboard(@PathVariable Long familyId, Authentication authentication) {
        AuthUserPrincipal currentUser = authContextService.getCurrentUser(authentication);
        if (currentUser == null) {
            return Result.error(401, "未登录或登录已过期");
        }
        Family family = authContextService.findActiveFamily(familyId);
        if (family == null) {
            return Result.error(404, "族谱不存在");
        }
        if (!authContextService.canAccessFamily(familyId, currentUser)) {
            return Result.error(403, "无权访问该族谱统计");
        }

        DashboardVO dashboard = new DashboardVO();
        dashboard.setTotalMembers(dashboardMapper.countMembers(familyId));
        dashboard.setMaleCount(dashboardMapper.countMembersByGender(familyId, "M"));
        dashboard.setFemaleCount(dashboardMapper.countMembersByGender(familyId, "F"));
        dashboard.setGenerationStats(dashboardMapper.selectGenerationStats(familyId));
        dashboard.setLifespanStats(normalizeLifespanStats(dashboardMapper.selectLifespanStats(familyId)));
        dashboard.setRelationStats(dashboardMapper.selectRelationStats(familyId));

        return Result.success(dashboard);
    }

    private LifespanStatVO normalizeLifespanStats(LifespanStatVO lifespanStats) {
        return lifespanStats == null ? new LifespanStatVO() : lifespanStats;
    }
}
