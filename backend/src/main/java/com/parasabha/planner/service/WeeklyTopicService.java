package com.parasabha.planner.service;

import com.parasabha.planner.domain.WeeklyTopic;
import com.parasabha.planner.dto.WeeklyTopicDto;
import com.parasabha.planner.dto.WeeklyTopicRequest;
import com.parasabha.planner.repository.WeeklyTopicRepository;
import com.parasabha.planner.util.WeekUtil;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages the P1/P2 પ્રવચન વિષય (discourse topic) - and an optional link for each - planned
 * for a given week. This is a single record per week rather than being tied to any one Mandal
 * or ScheduleEntry; a week with no record simply has no topics planned yet.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class WeeklyTopicService {

    private final WeeklyTopicRepository weeklyTopicRepository;

    @Transactional(readOnly = true)
    public WeeklyTopicDto getForWeek(LocalDate weekStart) {
        LocalDate monday = WeekUtil.mondayOf(weekStart);
        return weeklyTopicRepository.findByWeekStart(monday)
                .map(this::toDto)
                // No plan saved yet for this week - return an empty shell rather than 404, so the
                // frontend can always render the same form/section regardless of whether a plan exists.
                .orElseGet(() -> WeeklyTopicDto.builder().weekStart(monday).build());
    }

    public WeeklyTopicDto upsert(WeeklyTopicRequest request) {
        LocalDate monday = WeekUtil.mondayOf(request.getWeekStart());
        WeeklyTopic topic = weeklyTopicRepository.findByWeekStart(monday)
                .orElseGet(() -> WeeklyTopic.builder().weekStart(monday).build());

        topic.setP1Topic(normalize(request.getP1Topic()));
        topic.setP1Link(normalize(request.getP1Link()));
        topic.setP2Topic(normalize(request.getP2Topic()));
        topic.setP2Link(normalize(request.getP2Link()));

        return toDto(weeklyTopicRepository.save(topic));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private WeeklyTopicDto toDto(WeeklyTopic topic) {
        return WeeklyTopicDto.builder()
                .id(topic.getId())
                .weekStart(topic.getWeekStart())
                .p1Topic(topic.getP1Topic())
                .p1Link(topic.getP1Link())
                .p2Topic(topic.getP2Topic())
                .p2Link(topic.getP2Link())
                .build();
    }
}
