package com.genealogy.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class DashboardVO {
    private Long totalMembers;
    private Long maleCount;
    private Long femaleCount;
    private List<GenerationStatVO> generationStats;
    private LifespanStatVO lifespanStats;
    private List<RelationStatVO> relationStats;
}
