package com.subsflow.common.config;

import org.hibernate.cfg.AvailableSettings;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;

@Component
public class TenantConnectionProvider implements MultiTenantConnectionProvider, HibernatePropertiesCustomizer {

    private final DataSource dataSource;

    public TenantConnectionProvider(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Connection getAnyConnection() throws SQLException {
        return dataSource.getConnection();
    }

    @Override
    public void releaseAnyConnection(Connection connection) throws SQLException {
        connection.close();
    }

    @Override
    public Connection getConnection(Object tenantIdentifier) throws SQLException {
        Connection connection = dataSource.getConnection();
        String tenantId = tenantIdentifier != null ? tenantIdentifier.toString() : null;
        if (tenantId != null && !TenantIdentifierResolver.BOOTSTRAP_TENANT.equals(tenantId)) {
            if (!tenantId.matches("^[a-zA-Z0-9_-]+$")) {
                throw new IllegalArgumentException("Invalid tenant identifier format");
            }
            try (Statement stmt = connection.createStatement()) {
                stmt.execute("SET app.current_tenant_id = '" + tenantId + "'");
            } catch (SQLException e) {
                connection.close();
                throw e;
            }
        }
        return connection;
    }

    @Override
    public void releaseConnection(Object tenantIdentifier, Connection connection) throws SQLException {
        String tenantId = tenantIdentifier != null ? tenantIdentifier.toString() : null;
        if (tenantId != null && !TenantIdentifierResolver.BOOTSTRAP_TENANT.equals(tenantId)) {
            try (Statement stmt = connection.createStatement()) {
                stmt.execute("RESET app.current_tenant_id");
            } catch (SQLException e) {
                connection.close();
                throw e;
            }
        }
        connection.close();
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    @Override
    public boolean isUnwrappableAs(Class<?> unwrapType) {
        return false;
    }

    @Override
    public <T> T unwrap(Class<T> unwrapType) {
        return null;
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, this);
    }
}
