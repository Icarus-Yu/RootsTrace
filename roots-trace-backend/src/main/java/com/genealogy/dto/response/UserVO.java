package com.genealogy.dto.response;

import com.genealogy.entity.User;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class UserVO {
    private Long id;
    private String username;
    private String email;
    private OffsetDateTime createdAt;

    public static UserVO from(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setEmail(user.getEmail());
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }
}
