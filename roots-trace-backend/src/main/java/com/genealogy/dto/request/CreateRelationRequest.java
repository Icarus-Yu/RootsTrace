package com.genealogy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateRelationRequest {
    @NotNull(message = "族谱 ID 不能为空")
    private Long familyId;

    @NotNull(message = "起点成员 ID 不能为空")
    private Long fromMemberId;

    @NotNull(message = "终点成员 ID 不能为空")
    private Long toMemberId;

    @NotBlank(message = "关系类型不能为空")
    @Pattern(
            regexp = "PARENT_SON|PARENT_DAUGHTER|MOTHER_SON|MOTHER_DAUGHTER|SPOUSE",
            message = "关系类型不合法"
    )
    private String relationType;
}
