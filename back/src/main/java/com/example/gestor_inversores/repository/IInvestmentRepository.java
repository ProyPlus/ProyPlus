package com.example.gestor_inversores.repository;

import com.example.gestor_inversores.model.Investment;
import com.example.gestor_inversores.model.enums.InvestmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IInvestmentRepository extends JpaRepository<Investment, Long> {

    Optional<Investment> findByIdInvestmentAndDeletedFalse(Long idInvestment);
    List<Investment> findByDeletedFalse();
    List<Investment> findByDeletedFalseAndStatusIn(List<InvestmentStatus> statuses);
    List<Investment> findByProject_IdProjectAndDeletedFalseAndStatusIn(Long projectId, List<InvestmentStatus> statuses);

}