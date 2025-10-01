package com.example.gestor_inversores.repository;

import com.example.gestor_inversores.model.Investor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IInvestorRepository extends JpaRepository<Investor, Long> {

    Optional<Investor> findByCuit(String cuit);
}
