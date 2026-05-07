package com.genealogy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.genealogy.common.Result;
import com.genealogy.dto.request.LoginRequest;
import com.genealogy.dto.request.RegisterRequest;
import com.genealogy.dto.response.LoginResponse;
import com.genealogy.dto.response.UserVO;
import com.genealogy.entity.User;
import com.genealogy.mapper.UserMapper;
import com.genealogy.security.AuthUserPrincipal;
import com.genealogy.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public Result<UserVO> register(@Valid @RequestBody RegisterRequest request) {
        if (existsByUsername(request.getUsername())) {
            return Result.error(400, "用户名已存在");
        }
        if (existsByEmail(request.getEmail())) {
            return Result.error(400, "邮箱已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        try {
            userMapper.insert(user);
        } catch (DuplicateKeyException e) {
            return Result.error(400, "用户名或邮箱已存在");
        }

        return Result.success(UserVO.from(user));
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String account = request.getAccount().trim();
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, account)
                .or()
                .eq(User::getEmail, account.toLowerCase())
                .last("LIMIT 1"));

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return Result.error(401, "账号或密码错误");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return Result.success(new LoginResponse(token, UserVO.from(user)));
    }

    @GetMapping("/me")
    public Result<UserVO> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUserPrincipal principal)) {
            return Result.error(401, "未登录或登录已过期");
        }

        User user = userMapper.selectById(principal.getId());
        if (user == null) {
            return Result.error(401, "用户不存在");
        }

        return Result.success(UserVO.from(user));
    }

    private boolean existsByUsername(String username) {
        return userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username.trim())) > 0;
    }

    private boolean existsByEmail(String email) {
        return userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email.trim().toLowerCase())) > 0;
    }
}
