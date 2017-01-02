package com.ims.spring;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.ims.security.model.UserProfile;

@Component
public class SpringSecurityAuthenticationService implements AuthenticationService {

    AuthenticationManager authenticationManager;

    public UserProfile authenticate(String username, String password) {
        Authentication request = new UsernamePasswordAuthenticationToken(username, password);
        Authentication result = authenticationManager.authenticate(request);
        return (UserProfile) result.getPrincipal();
    }

    public AuthenticationManager getAuthenticationManager() {
        return authenticationManager;
    }

    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

}
