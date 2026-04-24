package com.genealogy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.genealogy.entity.Relation;
import com.genealogy.dto.response.MemberNodeVO;
import com.genealogy.dto.response.RelationEdgeVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface RelationMapper extends BaseMapper<Relation> {
    List<MemberNodeVO> findAllAncestors(@Param("memberId") Long memberId);
    
    List<MemberNodeVO> findAllDescendants(@Param("memberId") Long memberId, @Param("maxDepth") int maxDepth);
    
    RelationEdgeVO findKinshipPath(@Param("familyId") Long familyId, 
                                   @Param("memberAId") Long memberAId, 
                                   @Param("memberBId") Long memberBId);
}
