INSERT INTO `idp` (`id`, `name`, `domain`, `contactEmail`, `use_enhanced_reader_at`, `use_audiobooks_at`, `specialPricing`, `fromEmail`, `authMethod`, `sessionSharingAsRecipientInfo`, `entryPoint`, `logoutUrl`, `nameQualifier`, `idpcert`, `spcert`, `spkey`, `internalJWT`, `userInfoEndpoint`, `userInfoJWT`, `actionEndpoint`, `androidAppURL`, `iosAppURL`, `xapiOn`, `xapiEndpoint`, `xapiUsername`, `xapiPassword`, `xapiMaxBatchSize`, `readingSessionsOn`, `consentText`, `amplitudeSecretKey`, `maxMBPerBook`, `maxMBPerFile`, `googleAnalyticsCode`, `language`, `created_at`, `demo_expires_at`, `deviceLoginLimit`, `emailBGColor`, `emailInnerBGColor`, `emailLogoUrl`, `emailHideName`)
VALUES
	(21, X'546F616420526561646572', X'3139322E3136382E312E37373A3139303036', X'61646D696E407265736F757263696E67656475636174696F6E2E636F6D', '2022-02-17 00:00:00.000', '2023-12-01 00:00:00.000', NULL, NULL, X'454D41494C', NULL, NULL, NULL, X'', NULL, NULL, NULL, X'6B426149466738494E676534464139794746765743744662426B7039325671754C3939524F56376A', NULL, NULL, NULL, X'68747470733A2F2F706C61792E676F6F676C652E636F6D2F73746F72652F617070732F64657461696C733F69643D636F6D2E746F61647265616465722E64656D6F', X'68747470733A2F2F6974756E65732E6170706C652E636F6D2F75732F6170702F746F61642D7265616465722F6964313431353039393436383F6D743D38', 0, NULL, NULL, NULL, NULL, 1, NULL, NULL, 40, 15, NULL, NULL, '2017-05-01 00:00:00.000', NULL, 1, NULL, NULL, X'68747470733A2F2F73332E616D617A6F6E6177732E636F6D2F63646E2E746F61647265616465722E636F6D2F74656E616E745F6173736574732F6C6F676F2D746F61647265616465722E706E67', 1);

INSERT INTO `user` (`id`, `user_id_from_idp`, `idp_id`, `email`, `fullname`, `adminLevel`, `created_at`, `last_login_at`, `last_login_platform`)
VALUES
	(3, 'dev@toadreader.com', 21, 'dev@toadreader.com', 'Mr. Dev', 'ADMIN', '2020-10-14 16:47:50.859', '2024-02-29 21:32:48.023', 'Chrome 122.0.0 / Mac OS X 10.15.7');

INSERT INTO `user` (`id`, `user_id_from_idp`, `idp_id`, `email`, `fullname`, `adminLevel`, `created_at`, `last_login_at`, `last_login_platform`)
VALUES
	(-21, 'dummy@toadreader.com', 21, 'dummy@toadreader.com', 'No login', 'NONE', '2020-10-14 16:47:50.859', '2024-01-23 17:27:06.070', NULL);
