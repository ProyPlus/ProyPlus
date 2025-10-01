package com.example.gestor_inversores.mapper;

import com.example.gestor_inversores.dto.RequestProjectCurrentGoalUpdateDTO;
import com.example.gestor_inversores.dto.RequestProjectDTO;
import com.example.gestor_inversores.dto.RequestProjectUpdateDTO;
import com.example.gestor_inversores.dto.ResponseProjectDTO;
import com.example.gestor_inversores.model.Project;

public class ProjectMapper {

    private ProjectMapper() {}

    public static Project requestProjectToProject(RequestProjectDTO requestProjectDTO) {
        return Project.builder()
                .name(requestProjectDTO.getName())
                .description(requestProjectDTO.getDescription())
                .budgetGoal(requestProjectDTO.getBudgetGoal())
                .status(requestProjectDTO.getStatus())
                .startDate(requestProjectDTO.getStartDate())
                .estimatedEndDate(requestProjectDTO.getEstimatedEndDate())
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
                .build();
    }

    public static Project requestProjectCurrentGoalUpdateToProject(RequestProjectCurrentGoalUpdateDTO dto, Project project) {
        project.setCurrentGoal(dto.getCurrentGoal());
        return project;
    }
}
