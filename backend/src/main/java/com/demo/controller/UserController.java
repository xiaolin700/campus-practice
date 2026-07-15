package com.demo.controller;

import com.demo.entity.User;
import com.demo.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User user) {
        userService.register(user);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "注册成功");
        return result;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> params) {
        String token = userService.login(params.get("username"), params.get("password"));
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("token", token);
        result.put("message", "登录成功");
        return result;
    }

    @GetMapping("/list")
    public Map<String, Object> list() {
        List<User> users = userService.listAll();
        List<Map<String, Object>> safeUsers = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("status", u.getStatus());
            m.put("createTime", u.getCreateTime());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("data", safeUsers);
        return result;
    }
}
