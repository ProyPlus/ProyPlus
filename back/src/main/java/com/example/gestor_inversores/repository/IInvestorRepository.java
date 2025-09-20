package com.example.gestor_inversores.repository;

import com.example.gestor_inversores.model.Investor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IInvestorRepository extends JpaRepository<Investor, Long> {
}
