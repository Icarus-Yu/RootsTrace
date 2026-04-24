package com.genealogy.dto.response;

import lombok.Data;

@Data
public class MemberNodeVO {
    private Long id;
    private String name;
    private String gender;
    private Integer birthYear;
    private Integer deathYear;
    private Integer generation;
    private Long parentId;
    private Integer depth;
}
