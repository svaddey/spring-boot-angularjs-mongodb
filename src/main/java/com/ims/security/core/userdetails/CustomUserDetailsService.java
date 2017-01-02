package com.ims.security.core.userdetails;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.ims.security.model.UserProfile;

@Component
public class CustomUserDetailsService implements UserDetailsService {

	@Autowired
	private MongoTemplate mongoTemplate;

	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		UserProfile user = getUserDetail(username);
		if (user != null && user.getRole() != null) {
			List<GrantedAuthority> authorities = getAuthorities(user.getRole());
			user.setAuthorities(authorities);
		}
		return user;
	}

	@Autowired
	public void setMongoTemplate(MongoTemplate mongoTemplate) {
		this.mongoTemplate = mongoTemplate;
	}

	public List<GrantedAuthority> getAuthorities(Long role) {
		List<GrantedAuthority> authList = new ArrayList<GrantedAuthority>();
		if (role.intValue() == 1) {
			authList.add(new SimpleGrantedAuthority("ROLE_AGENT"));
		} else if (role.intValue() == 2) {
			authList.add(new SimpleGrantedAuthority("ROLE_USER"));
		} else if (role.intValue() == 3) {
			authList.add(new SimpleGrantedAuthority("ROLE_AUTHORITY"));
		}
		return authList;
	}

	public UserProfile getUserDetail(String username) {
		MongoOperations mongoOperation = (MongoOperations) mongoTemplate;
		UserProfile user = mongoOperation.findOne(new Query(Criteria.where("username").is(username)), UserProfile.class);
		System.out.println(user.toString());
		return user;
	}

}