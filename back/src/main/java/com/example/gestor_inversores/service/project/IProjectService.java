package com.example.gestor_inversores.service.project;

import com.example.gestor_inversores.dto.RequestProjectDTO;
import com.example.gestor_inversores.dto.RequestProjectUpdateDTO;
import com.example.gestor_inversores.dto.ResponseProjectDTO;
import com.example.gestor_inversores.dto.ResponseStudentDTO;

import java.util.List;

public interface IProjectService {

    ResponseProjectDTO save(RequestProjectDTO projectDTO);
    ResponseProjectDTO update(Long id, RequestProjectUpdateDTO projectDTO);
    void delete(Long id);
    List<ResponseProjectDTO> getAllProjects();
    List<ResponseStudentDTO> getStudentsByProject(Long projectId);
    ResponseProjectDTO findById(Long id);
}
