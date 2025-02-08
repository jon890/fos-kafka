package com.bifos.tradingengine.order.presentation

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("order")
class OrderController {

    /**
     * 아이템 주문 처리
     */
    @PostMapping
    fun order() {

    }
}