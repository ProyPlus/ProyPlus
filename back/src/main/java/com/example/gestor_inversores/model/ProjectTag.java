package com.example.gestor_inversores.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "project_tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProjectTag;
    private String name;

    @OneToMany(mappedBy = "projectTag")
    private Set<Project> projects = new HashSet<>();
}
