package com.genealogy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateFamilyRequest {
    @NotBlank(message = "族谱名称不能为空")
    @Size(max = 100, message = "族谱名称不能超过 100 个字符")
    private String name;

    @Size(max = 50, message = "姓氏不能超过 50 个字符")
    private String surname;

    private LocalDate compiledAt;
}
