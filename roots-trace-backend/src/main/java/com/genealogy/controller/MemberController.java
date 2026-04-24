package com.genealogy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.genealogy.common.Result;
import com.genealogy.entity.Member;
import com.genealogy.mapper.MemberMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    @Autowired
    private MemberMapper memberMapper;

    @GetMapping("/family/{familyId}")
    public Result<List<Member>> getMembersByFamily(@PathVariable Long familyId) {
        LambdaQueryWrapper<Member> query = new LambdaQueryWrapper<>();
        query.eq(Member::getFamilyId, familyId).last("LIMIT 100"); // Limit for initial view
        return Result.success(memberMapper.selectList(query));
    }
    
    @PostMapping
    public Result<Member> addMember(@RequestBody Member member) {
        memberMapper.insert(member);
        return Result.success(member);
    }
}
