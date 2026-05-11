package com.genealogy.dto.response;

import lombok.Data;

@Data
public class RelationEdgeVO {
    private Long fromMemberId;
    private Long toMemberId;
    private String relationType;
    private String[] pathEdges; // Used for kinship path
}
