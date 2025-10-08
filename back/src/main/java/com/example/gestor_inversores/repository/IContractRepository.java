package com.example.gestor_inversores.repository;

import com.example.gestor_inversores.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByProject_IdProject(Long projectId);

    List<Contract> findByCreatedByInvestorId(Long investorId);

}
