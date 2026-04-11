package com.ethervault.backend.security;

import com.ethervault.backend.model.Institution;
import com.ethervault.backend.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final InstitutionRepository institutionRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Institution institution = institutionRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        return new org.springframework.security.core.userdetails.User(
                institution.getEmail(),
                institution.getPassword(),
                List.of(new SimpleGrantedAuthority(institution.getRole().name()))
        );
    }
}
