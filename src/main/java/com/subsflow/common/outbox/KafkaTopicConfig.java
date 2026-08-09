package com.subsflow.common.outbox;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic paymentSucceededTopic() {
        return TopicBuilder.name("payment.succeeded").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic paymentFailedTopic() {
        return TopicBuilder.name("payment.failed").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic subscriptionChangedTopic() {
        return TopicBuilder.name("subscription.changed").partitions(1).replicas(1).build();
    }
}
