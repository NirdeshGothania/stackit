import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/question.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'ask_question_screen.dart';
import 'question_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Question> _questions = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 1;
  String _selectedFilter = 'newest';
  String _searchQuery = '';
  String? _selectedTag;

  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadQuestions();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) {
        _loadMoreQuestions();
      }
    }
  }

  Future<void> _loadQuestions({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _questions.clear();
        _hasMore = true;
      });
    }

    if (_isLoading) return;

    setState(() => _isLoading = true);

    try {
      final questions = await ApiService.getQuestions(
        page: _currentPage,
        filter: _selectedFilter,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        tag: _selectedTag,
      );

      setState(() {
        if (refresh) {
          _questions = questions;
        } else {
          _questions.addAll(questions);
        }
        _hasMore = questions.length == 10; // Assuming 10 is the page size
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading questions: $e')),
      );
    }
  }

  Future<void> _loadMoreQuestions() async {
    if (_isLoading || !_hasMore) return;

    setState(() {
      _currentPage++;
      _isLoading = true;
    });

    try {
      final questions = await ApiService.getQuestions(
        page: _currentPage,
        filter: _selectedFilter,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        tag: _selectedTag,
      );

      setState(() {
        _questions.addAll(questions);
        _hasMore = questions.length == 10;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _currentPage--;
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading more questions: $e')),
      );
    }
  }

  void _onFilterChanged(String filter) {
    setState(() => _selectedFilter = filter);
    _loadQuestions(refresh: true);
  }

  void _onSearchChanged(String query) {
    setState(() => _searchQuery = query);
    _loadQuestions(refresh: true);
  }

  void _onTagChanged(String? tag) {
    setState(() => _selectedTag = tag);
    _loadQuestions(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('StackIt'),
        actions: [
          if (authProvider.isSignedIn)
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'profile') {
                  // TODO: Navigate to profile
                } else if (value == 'logout') {
                  authProvider.signOut();
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'profile',
                  child: Row(
                    children: [
                      const Icon(Icons.person),
                      const SizedBox(width: 8),
                      Text(authProvider.userDisplayName ?? 'Profile'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout),
                      SizedBox(width: 8),
                      Text('Logout'),
                    ],
                  ),
                ),
              ],
              child: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  (authProvider.userDisplayName?.isNotEmpty == true)
                      ? authProvider.userDisplayName![0].toUpperCase()
                      : 'U',
                  style: const TextStyle(color: Color(0xFF0D47A1)),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filters
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search questions...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _onSearchChanged('');
                            },
                          )
                        : null,
                    border: const OutlineInputBorder(),
                  ),
                  onChanged: _onSearchChanged,
                ),
                const SizedBox(height: 16),

                // Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      FilterChip(
                        label: const Text('Newest'),
                        selected: _selectedFilter == 'newest',
                        onSelected: (_) => _onFilterChanged('newest'),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Unanswered'),
                        selected: _selectedFilter == 'unanswered',
                        onSelected: (_) => _onFilterChanged('unanswered'),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Most Voted'),
                        selected: _selectedFilter == 'most_voted',
                        onSelected: (_) => _onFilterChanged('most_voted'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Questions List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _loadQuestions(refresh: true),
              child: _questions.isEmpty && !_isLoading
                  ? const Center(
                      child: Text(
                        'No questions found',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _questions.length + (_hasMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _questions.length) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        final question = _questions[index];
                        return QuestionCard(
                          question: question,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  QuestionDetailScreen(questionId: question.id),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: authProvider.isSignedIn
          ? FloatingActionButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AskQuestionScreen(),
                ),
              ),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}

class QuestionCard extends StatelessWidget {
  final Question question;
  final VoidCallback onTap;

  const QuestionCard({
    super.key,
    required this.question,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title
              Text(
                question.title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Content preview
              Text(
                question.content,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),

              // Tags
              if (question.tags.isNotEmpty)
                Wrap(
                  spacing: 4,
                  children: question.tags
                      .take(3)
                      .map((tag) => Chip(
                            label: Text(tag),
                            backgroundColor:
                                const Color(0xFF0D47A1).withOpacity(0.1),
                            labelStyle: const TextStyle(
                              color: Color(0xFF0D47A1),
                              fontSize: 12,
                            ),
                          ))
                      .toList(),
                ),
              const SizedBox(height: 12),

              // Stats and author
              Row(
                children: [
                  // Votes
                  Row(
                    children: [
                      const Icon(Icons.thumb_up, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${question.voteCount}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),

                  // Answers
                  Row(
                    children: [
                      const Icon(Icons.question_answer,
                          size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${question.answerCount}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                  const Spacer(),

                  // Author and time
                  Text(
                    'by ${question.authorName}',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
