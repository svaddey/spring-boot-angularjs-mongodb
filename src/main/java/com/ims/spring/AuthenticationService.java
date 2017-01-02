package com.ims.spring;

import com.ims.security.model.UserProfile;



public interface AuthenticationService {

    UserProfile authenticate(final String username, final String password);

}
