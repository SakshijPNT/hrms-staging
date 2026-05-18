CREATE TABLE companymaster (
    id                  SERIAL          NOT NULL PRIMARY KEY,          -- surrogate auto-increment
    companyname         VARCHAR(200)    NOT NULL,
    companycode         VARCHAR(20)     NOT NULL UNIQUE,
    companyphone        VARCHAR(20),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100),
    pincode             VARCHAR(20),
    timezone            VARCHAR(60)     NOT NULL DEFAULT 'Asia/Kolkata',
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);



CREATE TABLE rolemaster (
    id          SERIAL          NOT NULL PRIMARY KEY,
    rolename    VARCHAR(100)    NOT NULL UNIQUE,
    description VARCHAR(255),
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);



CREATE TABLE usermaster (
    id                SERIAL PRIMARY KEY,
    fullname          VARCHAR(150)    NOT NULL,
    emailid           VARCHAR(150)    NOT NULL UNIQUE,
    password          VARCHAR(255)    NOT NULL,
    managerid         INT,
    companyid         INT             NOT NULL,
    roleid            INT             NOT NULL,
    joiningdate       DATE            NOT NULL,
    probationmonths   INT             NOT NULL DEFAULT 0,
    confirmationdate  DATE,
    statuscode        SMALLINT        NOT NULL DEFAULT 1,
    createdby         INT             NOT NULL,
    createdon         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby         INT             NOT NULL,
    updatedon         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_company FOREIGN KEY (companyid) REFERENCES companymaster(id),
    CONSTRAINT fk_user_role    FOREIGN KEY (roleid) REFERENCES rolemaster(id),
    CONSTRAINT fk_user_manager FOREIGN KEY (managerid) REFERENCES usermaster(id)
);

CREATE INDEX idx_usermaster_emailid   ON usermaster(emailid);
CREATE INDEX idx_usermaster_companyid ON usermaster(companyid);


CREATE TABLE activitymaster (
    id           SERIAL          NOT NULL PRIMARY KEY,
    activitycode VARCHAR(50)     NOT NULL UNIQUE,
    activityname VARCHAR(100)    NOT NULL,
    description  VARCHAR(255)    NOT NULL,
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);



CREATE TABLE activityrolemapping (
    id          SERIAL      NOT NULL PRIMARY KEY,
    activityid  INT         NOT NULL,
    roleid      INT         NOT NULL,
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_arm_activity FOREIGN KEY (activityid) REFERENCES activitymaster(id),
    CONSTRAINT fk_arm_role     FOREIGN KEY (roleid)     REFERENCES rolemaster(id),
    CONSTRAINT uq_arm_activity_role UNIQUE (activityid, roleid)
);


CREATE TABLE modulemaster (
    id          SERIAL          NOT NULL PRIMARY KEY,
    parentmoduleid INT,
    modulename  VARCHAR(100)    NOT NULL,
    description VARCHAR(255),
    iconurl     VARCHAR(255),
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_modulemaster_parent
        FOREIGN KEY (parentmoduleid) REFERENCES modulemaster(id),
    CONSTRAINT chk_modulemaster_parent_not_self
        CHECK (parentmoduleid IS NULL OR parentmoduleid <> id)
);

CREATE INDEX ix_modulemaster_parentmoduleid ON modulemaster(parentmoduleid);


CREATE TABLE activitymodulemapping (
    id          SERIAL  NOT NULL PRIMARY KEY,
    moduleid    INT     NOT NULL,
    activityid  INT     NOT NULL,
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_amm_module   FOREIGN KEY (moduleid)   REFERENCES modulemaster(id),
    CONSTRAINT fk_amm_activity FOREIGN KEY (activityid) REFERENCES activitymaster(id),
    CONSTRAINT uq_amm_module_activity UNIQUE (moduleid, activityid)
);


CREATE TABLE leavetypemaster (
    id               SERIAL          NOT NULL PRIMARY KEY,
    companyid        INT             NOT NULL,
    leavetypename    VARCHAR(100)    NOT NULL,
    description      VARCHAR(255),
    maxdaysallowed   NUMERIC(5,1)    NOT NULL DEFAULT 0,
    iscarryforward   BOOLEAN        NOT NULL DEFAULT 0,
    maxcarryforward  NUMERIC(5,1),
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ltm_company      FOREIGN KEY (companyid) REFERENCES companymaster(id),
    CONSTRAINT uq_ltm_company_name UNIQUE (companyid, leavetypename)
);


CREATE TABLE leaveapplications (
    id              SERIAL          NOT NULL PRIMARY KEY,
    userid          INT             NOT NULL,
    leavetypeid     INT             NOT NULL,
    fromdate        DATE            NOT NULL,
    todate          DATE            NOT NULL,
    totaldays       NUMERIC(5,1)    NOT NULL,
    ishalfday       BOOLEAN        NOT NULL DEFAULT 0,
    session         VARCHAR(20),
    reason          VARCHAR(500),
    approvalstatus  VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                        CHECK (approvalstatus IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
    approvedby      INT,
    approvedon      TIMESTAMPTZ,
    approverremark  VARCHAR(500),
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_la_user      FOREIGN KEY (userid)      REFERENCES usermaster(id),
    CONSTRAINT fk_la_leavetype FOREIGN KEY (leavetypeid) REFERENCES leavetypemaster(id),
    CONSTRAINT fk_la_approver  FOREIGN KEY (approvedby)  REFERENCES usermaster(id),
    CONSTRAINT chk_la_dates    CHECK (todate >= fromdate),
    CONSTRAINT chk_la_session  CHECK (session IS NULL OR session IN ('FIRST_HALF','SECOND_HALF'))
);

CREATE INDEX idx_la_userid   ON leaveapplications(userid);
CREATE INDEX idx_la_fromdate ON leaveapplications(fromdate);
CREATE INDEX idx_la_status   ON leaveapplications(approvalstatus);



CREATE TABLE userleavebalances (
    id               SERIAL          NOT NULL PRIMARY KEY,
    userid           INT             NOT NULL,
    leavetypeid      INT             NOT NULL,
    cycleyear        SMALLINT        NOT NULL,
    openingbalance   NUMERIC(5,1)    NOT NULL DEFAULT 0,
    crediteddays     NUMERIC(5,1)    NOT NULL DEFAULT 0,
    takendays        NUMERIC(5,1)    NOT NULL DEFAULT 0,
    availablebalance NUMERIC(5,1)    NOT NULL DEFAULT 0,
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ulb_user      FOREIGN KEY (userid)      REFERENCES usermaster(id),
    CONSTRAINT fk_ulb_leavetype FOREIGN KEY (leavetypeid) REFERENCES leavetypemaster(id),
    CONSTRAINT uq_ulb_user_type_year UNIQUE (userid, leavetypeid, cycleyear)
);


CREATE TABLE userattendancelogs (
    id               SERIAL          NOT NULL PRIMARY KEY,
    userid           INT             NOT NULL,
    logdate          DATE            NOT NULL,
    checkintime      TIMESTAMPTZ,
    checkouttime     TIMESTAMPTZ,
    workedminutes    INT             NOT NULL DEFAULT 0,
    attendancestatus VARCHAR(20)     NOT NULL,
    islate           BOOLEAN        NOT NULL DEFAULT 0,
    isearlyleave     BOOLEAN        NOT NULL DEFAULT 0,
    remarks          VARCHAR(255),
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ual_user     FOREIGN KEY (userid) REFERENCES usermaster(id),
    CONSTRAINT uq_ual_user_date UNIQUE (userid, logdate)
);

CREATE INDEX idx_ual_userid  ON userattendancelogs(userid);
CREATE INDEX idx_ual_logdate ON userattendancelogs(logdate);


CREATE TABLE holidaylist (
    id          SERIAL          NOT NULL PRIMARY KEY,
    companyid   INT             NOT NULL,
    holidaydate DATE            NOT NULL,
    holidayname VARCHAR(150)    NOT NULL,
    description VARCHAR(255),
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_hl_company      FOREIGN KEY (companyid) REFERENCES companymaster(id),
    CONSTRAINT uq_hl_company_date UNIQUE (companyid, holidaydate)
);



CREATE TABLE companypolicies (
    id                    SERIAL          NOT NULL PRIMARY KEY,
    companyid             INT             NOT NULL,
    workhours             NUMERIC(4,2)    NOT NULL DEFAULT 8.00,
    halfday_threshold     NUMERIC(4,2)    NOT NULL DEFAULT 4.00,
    checkin_graceperiod   INT             NOT NULL DEFAULT 15,
    checkout_graceperiod  INT             NOT NULL DEFAULT 15,
    workdays              VARCHAR(40)     NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI',
    shiftstart            TIME            NOT NULL DEFAULT '09:00:00',
    shiftend              TIME            NOT NULL DEFAULT '17:00:00',
    statuscode   SMALLINT        NOT NULL DEFAULT 1,
    createdby    INT             NOT NULL,
    createdon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updatedby    INT             NOT NULL,
    updatedon    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cp_company  FOREIGN KEY (companyid) REFERENCES companymaster(id),
    CONSTRAINT chk_cp_shift   CHECK (shiftend > shiftstart)
);
