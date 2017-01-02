package com.ims.ui.controller;

import java.util.Collection;
import java.util.Iterator;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ims.security.model.RestResponse;
import com.ims.security.model.UserProfile;
import com.ims.spring.AuthenticationService;
import com.ims.ui.model.User;

@RestController
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LoginController {
	@Autowired
    private AuthenticationService authenticationService;

	@RequestMapping("/ui/users/authenticate")
    @GET
    public Response authenticate(@QueryParam("username") String username, @QueryParam("password") String password) {
        try {
            UserProfile userProfile = getAuthenticationService().authenticate(username, password);
            return Response.status(Status.OK).entity(createUser(userProfile)).build();
        } catch (DisabledException e) {
            RestResponse response = new RestResponse();
            response.setCode(Status.FORBIDDEN.getStatusCode());
            return Response.status(Status.FORBIDDEN).entity(response).build();
        } catch (AuthenticationException e) {
            RestResponse response = new RestResponse();
            response.setCode(Status.UNAUTHORIZED.getStatusCode());
            return Response.status(Status.UNAUTHORIZED).entity(response).build();
        }
    }

    private User createUser(UserProfile userProfile) {
        User user = new User();
        user.setUsername(userProfile.getUsername());
        user.setId(userProfile.getId());
        user.setFirstName(userProfile.getFirstName());
        user.setLastName(userProfile.getLastName());
        user.setRole(getFirstElement(userProfile.getAuthorities()).getAuthority());
        return user;
    }

    private GrantedAuthority getFirstElement(Collection<GrantedAuthority> authorities) {
        Iterator<GrantedAuthority> it = authorities.iterator();
        while (it.hasNext()) {
            return it.next();
        }

        return null;
    }

    public AuthenticationService getAuthenticationService() {
		return authenticationService;
	}

	public void setAuthenticationService(AuthenticationService authenticationService) {
		this.authenticationService = authenticationService;
	}
}
