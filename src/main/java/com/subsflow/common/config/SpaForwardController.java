package com.subsflow.common.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    /**
     * Forwards non-static, non-API client routes to index.html for Single Page Application (SPA) routing.
     */
    @GetMapping(value = {
            "/{path:[^\\.]*}",
            "/*/{path:[^\\.]*}",
            "/*/*/{path:[^\\.]*}"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
