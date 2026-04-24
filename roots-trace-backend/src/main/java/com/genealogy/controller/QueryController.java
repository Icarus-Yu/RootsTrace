package com.genealogy.controller;

import com.genealogy.common.Result;
import com.genealogy.dto.response.MemberNodeVO;
import com.genealogy.dto.response.RelationEdgeVO;
import com.genealogy.mapper.RelationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/query")
public class QueryController {

    @Autowired
    private RelationMapper relationMapper;

    @GetMapping("/ancestors/{memberId}")
    public Result<List<MemberNodeVO>> getAncestors(@PathVariable Long memberId) {
        return Result.success(relationMapper.findAllAncestors(memberId));
    }

    @GetMapping("/descendants/{memberId}")
    public Result<List<MemberNodeVO>> getDescendants(@PathVariable Long memberId, 
                                                     @RequestParam(defaultValue = "10") int depth) {
        return Result.success(relationMapper.findAllDescendants(memberId, depth));
    }

    @GetMapping("/kinship")
    public Result<RelationEdgeVO> getKinshipPath(@RequestParam Long familyId,
                                                 @RequestParam Long a,
                                                 @RequestParam Long b) {
        return Result.success(relationMapper.findKinshipPath(familyId, a, b));
    }
}
