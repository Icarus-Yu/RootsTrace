package com.genealogy.dto.response;

import lombok.Data;

import java.util.List;

/**
 * Whole-family genealogy tree, rooted at the family's founding patriarch.
 * Small families are returned in full; large families are capped at a fixed
 * number of generations ({@link #full} = false) to stay renderable.
 */
@Data
public class FamilyTreeVO {
    private Long familyId;
    private Long rootId;          // founding member the tree is rooted at
    private Integer depth;        // effective traversal depth used
    private Boolean full;         // true = whole tree shown, false = truncated
    private Long totalMembers;    // total members in the family (incl. spouses)
    private List<MemberNodeVO> nodes;
}
