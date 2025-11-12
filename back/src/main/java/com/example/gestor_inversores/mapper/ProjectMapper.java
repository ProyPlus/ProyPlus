package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.RequestProjectCurrentGoalUpdateDTO;
import com.example.gestor_inversores.dto.RequestProjectDTO;
import com.example.gestor_inversores.dto.RequestProjectUpdateDTO;
import com.example.gestor_inversores.dto.ResponseProjectDTO;
import com.example.gestor_inversores.model.Project;
import com.example.gestor_inversores.model.Student;

public class ProjectMapper {

    private ProjectMapper() {}

    public static Project requestProjectToProject(RequestProjectDTO dto, Student owner) {
        return Project.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .budgetGoal(dto.getBudgetGoal())
                .startDate(dto.getStartDate())
                .estimatedEndDate(dto.getEstimatedEndDate())
                .owner(owner) // <--- owner agregado
                .build();
    }

    public static Project requestProjectUpdateToProject(RequestProjectUpdateDTO requestProjectUpdateDTO, Project searchedProject) {

        searchedProject.setName(requestProjectUpdateDTO.getName());
        searchedProject.setDescription(requestProjectUpdateDTO.getDescription());
        searchedProject.setBudgetGoal(requestProjectUpdateDTO.getBudgetGoal());
        searchedProject.setCurrentGoal(requestProjectUpdateDTO.getCurrentGoal());
        searchedProject.setStatus(requestProjectUpdateDTO.getStatus());
        searchedProject.setStartDate(requestProjectUpdateDTO.getStartDate());
        searchedProject.setEstimatedEndDate(requestProjectUpdateDTO.getEstimatedEndDate());
        return searchedProject;
    }

    public static ResponseProjectDTO projectToResponseProjectDTO(Project project) {
        Long ownerId = project.getOwner() != null ? project.getOwner().getId() : null;
        String ownerName = project.getOwner() != null
                ? project.getOwner().getFirstName() + " " + project.getOwner().getLastName()
                : "";
        String tagName = project.getProjectTag() != null ? project.getProjectTag().getName() : null;

        return ResponseProjectDTO.builder()
                .id(project.getIdProject())
                .name(project.getName())
                .description(project.getDescription())
                .budgetGoal(project.getBudgetGoal())
                .currentGoal(project.getCurrentGoal())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .estimatedEndDate(project.getEstimatedEndDate())
                .endDate(project.getEndDate())
                .ownerId(ownerId)
                .ownerName(ownerName)
                .tagName(tagName)
                .deleted(project.getDeleted())
                .students(project.getStudents().stream()
                        .filter(s -> project.getOwner() == null || !s.getId().equals(project.getOwner().getId()))
                        .map(ProjectStudentMapper::studentToResponseProjectStudentDTO)
                        .toList())
                .build();
    }

    public static Project requestProjectCurrentGoalUpdateToProject(RequestProjectCurrentGoalUpdateDTO dto, Project project) {
        project.setCurrentGoal(dto.getCurrentGoal());
        return project;
    }
}
