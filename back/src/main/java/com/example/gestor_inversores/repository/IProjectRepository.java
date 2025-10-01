package com.example.gestor_inversores.repository;

import com.example.gestor_inversores.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IProjectRepository extends JpaRepository<Project, Long> {
    boolean existsByNameAndDeletedFalse(String name);
    List<Project> findByDeletedFalse();
    Optional<Project> findByIdProjectAndDeletedFalse(Long id);
}
