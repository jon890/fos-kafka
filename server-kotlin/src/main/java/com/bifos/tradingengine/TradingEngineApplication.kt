package com.bifos.tradingengine

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class TradingEngineApplication {
}

fun main(args: Array<String>) {
    runApplication<TradingEngineApplication>(*args)
}