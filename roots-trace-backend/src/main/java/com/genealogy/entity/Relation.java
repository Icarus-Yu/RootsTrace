package com.genealogy.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("relations")
public class Relation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long familyId;
    private Long fromMemberId;
    private Long toMemberId;
    private String relationType;  // enum string
    private LocalDateTime createdAt;
}
