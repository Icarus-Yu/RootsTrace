package com.genealogy.security;

import com.genealogy.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthUserPrincipal {
    private Long id;
    private String username;
    private String email;

    public static AuthUserPrincipal from(User user) {
        return new AuthUserPrincipal(user.getId(), user.getUsername(), user.getEmail());
    }
}
