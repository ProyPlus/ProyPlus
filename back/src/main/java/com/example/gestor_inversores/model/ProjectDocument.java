package com.example.gestor_inversores.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "projectsDocuments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProjectDocument;

    @NotBlank(message = "El nombre del archivo es obligatorio")
    @Size(max = 255, message = "El nombre del archivo no puede superar 255 caracteres")
    private String fileName;

    /** Lo comento porque creo que no es necesario tener esto en la tabla
    @NotBlank(message = "El tipo de archivo es obligatorio")
    @Size(max = 100, message = "El tipo de archivo no puede superar 100 caracteres")
    private String fileType;
     **/

    @NotBlank(message = "La ruta del archivo es obligatoria")
    @Size(max = 500, message = "La ruta del archivo no puede superar 500 caracteres")
    private String filePath;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

}
