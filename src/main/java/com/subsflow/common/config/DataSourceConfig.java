package com.subsflow.common.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource(DataSourceProperties properties) {
        String originalUrl = properties.getUrl();
        
        HikariDataSource dataSource = properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();

        if (StringUtils.hasText(originalUrl)) {
            ParsedUrl parsed = parseUrl(originalUrl);
            dataSource.setJdbcUrl(parsed.jdbcUrl);
            if (StringUtils.hasText(parsed.username)) {
                dataSource.setUsername(parsed.username);
            }
            if (StringUtils.hasText(parsed.password)) {
                dataSource.setPassword(parsed.password);
            }
        }
        return dataSource;
    }

    private static class ParsedUrl {
        String jdbcUrl;
        String username;
        String password;
    }

    private ParsedUrl parseUrl(String url) {
        ParsedUrl result = new ParsedUrl();
        result.jdbcUrl = url;
        try {
            String uriStr = url;
            if (uriStr.startsWith("jdbc:")) {
                uriStr = uriStr.substring(5);
            }
            java.net.URI uri = new java.net.URI(uriStr);
            String userInfo = uri.getUserInfo();
            if (StringUtils.hasText(userInfo)) {
                String[] parts = userInfo.split(":", 2);
                result.username = parts[0];
                if (parts.length > 1) {
                    result.password = parts[1];
                }
                
                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                
                StringBuilder cleanJdbc = new StringBuilder("jdbc:postgresql://");
                cleanJdbc.append(host);
                if (port != -1) {
                    cleanJdbc.append(":").append(port);
                }
                if (StringUtils.hasText(path)) {
                    cleanJdbc.append(path);
                }
                String query = uri.getQuery();
                if (StringUtils.hasText(query)) {
                    cleanJdbc.append("?").append(query);
                }
                result.jdbcUrl = cleanJdbc.toString();
            } else {
                if (url.startsWith("postgresql://")) {
                    result.jdbcUrl = "jdbc:" + url;
                }
            }
        } catch (Exception e) {
            if (url.startsWith("postgresql://")) {
                result.jdbcUrl = "jdbc:" + url;
            }
        }
        return result;
    }
}
