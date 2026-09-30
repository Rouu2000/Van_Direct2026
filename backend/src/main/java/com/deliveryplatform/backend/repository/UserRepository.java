package com.deliveryplatform.backend.repository;

import com.deliveryplatform.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    List<User> findByRoleAndStatus(User.Role role, User.Status status);

    List<User> findByRole(User.Role role);
}
