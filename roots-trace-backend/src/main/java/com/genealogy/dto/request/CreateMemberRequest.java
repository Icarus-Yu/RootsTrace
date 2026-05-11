package com.genealogy.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateMemberRequest {
    @NotNull(message = "族谱 ID 不能为空")
    private Long familyId;

    @NotBlank(message = "成员姓名不能为空")
    @Size(max = 100, message = "成员姓名不能超过 100 个字符")
    private String name;

    @NotBlank(message = "性别不能为空")
    @Pattern(regexp = "M|F", message = "性别必须为 M 或 F")
    private String gender;

    @Min(value = 1, message = "出生年份必须大于 0")
    private Integer birthYear;

    @Min(value = 1, message = "死亡年份必须大于 0")
    private Integer deathYear;

    private String bio;

    @NotNull(message = "代际不能为空")
    @Min(value = 1, message = "代际必须大于 0")
    private Integer generation;
}
