create database sceneo;

CREATE TABLE gigs (
    gig_id text primary key,
    title text,
    description text,
    keywords text[],
    organiser text,
    city text,
    address text,
    artist text,
    date text,
    start_time text,
    username text,
    user_id text,
);


create table users (
    user_id serial primary key,
    email text unique,
    user_name text,
    password_digest text,
    user_city text,
    username text unique,
    account_type text,
    interests text[],
    saved text[]
);

create table images (
    gig_id integer,
    image_key text
);