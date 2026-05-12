package com.genealogy.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LifespanStatVO {
    private BigDecimal averageLifespan;
    private Integer maxLifespan;
    private Integer minLifespan;
}
