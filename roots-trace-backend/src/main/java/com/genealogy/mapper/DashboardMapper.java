package com.genealogy.mapper;

import com.genealogy.dto.response.GenerationStatVO;
import com.genealogy.dto.response.LifespanStatVO;
import com.genealogy.dto.response.RelationStatVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DashboardMapper {

    @Select("SELECT COUNT(*) FROM members WHERE family_id = #{familyId}")
    Long countMembers(@Param("familyId") Long familyId);

    @Select("SELECT COUNT(*) FROM members WHERE family_id = #{familyId} AND gender = #{gender}")
    Long countMembersByGender(@Param("familyId") Long familyId, @Param("gender") String gender);

    @Select("""
            SELECT generation, COUNT(*) AS count
            FROM members
            WHERE family_id = #{familyId}
            GROUP BY generation
            ORDER BY generation
            """)
    List<GenerationStatVO> selectGenerationStats(@Param("familyId") Long familyId);

    @Select("""
            SELECT
                ROUND(AVG(death_year - birth_year), 1) AS average_lifespan,
                MAX(death_year - birth_year) AS max_lifespan,
                MIN(death_year - birth_year) AS min_lifespan
            FROM members
            WHERE family_id = #{familyId}
              AND birth_year IS NOT NULL
              AND death_year IS NOT NULL
              AND death_year >= birth_year
            """)
    LifespanStatVO selectLifespanStats(@Param("familyId") Long familyId);

    @Select("""
            SELECT relation_type::TEXT AS relation_type,
                   CASE
                       WHEN relation_type = 'SPOUSE' THEN COUNT(DISTINCT CONCAT(LEAST(from_member_id, to_member_id), '-', GREATEST(from_member_id, to_member_id)))
                       ELSE COUNT(*)
                   END AS count
            FROM relations
            WHERE family_id = #{familyId}
            GROUP BY relation_type
            ORDER BY relation_type
            """)
    List<RelationStatVO> selectRelationStats(@Param("familyId") Long familyId);
}
