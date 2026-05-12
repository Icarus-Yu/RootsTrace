package com.genealogy.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@TableName("family_collaborators")
public class FamilyCollaborator {
    private Long familyId;
    private Long userId;
    private OffsetDateTime joinedAt;
}
