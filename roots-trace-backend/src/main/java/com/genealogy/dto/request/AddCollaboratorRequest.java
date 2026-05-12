package com.genealogy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddCollaboratorRequest {
    @NotBlank(message = "协作者账号不能为空")
    @Size(max = 100, message = "协作者账号不能超过 100 个字符")
    private String account;
}
