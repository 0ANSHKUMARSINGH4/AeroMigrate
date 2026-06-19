package com.aeromigrate.repository;

import com.aeromigrate.entity.MigrationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MigrationHistoryRepository extends JpaRepository<MigrationHistory, Long> {
    
    /**
     * Finds the latest applied migration history entry.
     */
    Optional<MigrationHistory> findFirstByStatusOrderByAppliedAtDesc(String status);
    
    /**
     * Finds all history entries ordered by application date.
     */
    List<MigrationHistory> findAllByOrderByAppliedAtDesc();
}
