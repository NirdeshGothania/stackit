import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:provider/provider.dart';

import '../models/answer.dart';
import '../models/question.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class QuestionDetailScreen extends StatefulWidget {
  final String questionId;

  const QuestionDetailScreen({super.key, required this.questionId});

  @override
  State<QuestionDetailScreen> createState() => _QuestionDetailScreenState();
}

class _QuestionDetailScreenState extends State<QuestionDetailScreen> {
  Question? _question;
  List<Answer> _answers = [];
  bool _isLoading = true;
  bool _isSubmittingAnswer = false;
  final _answerController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadQuestionAndAnswers();
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  Future<void> _loadQuestionAndAnswers() async {
    setState(() => _isLoading = true);

    try {
      final question = await ApiService.getQuestion(widget.questionId);
      final answers = await ApiService.getAnswers(widget.questionId);

      setState(() {
        _question = question['question'] as Question;
        _answers = answers;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading question: $e')),
      );
    }
  }

  Future<void> _submitAnswer() async {
    if (_answerController.text.trim().isEmpty) return;

    setState(() => _isSubmittingAnswer = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = await authProvider.idToken;
      if (token == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication token not available')),
        );
        return;
      }
      final answer = await ApiService.createAnswer(
        questionId: widget.questionId,
        content: _answerController.text.trim(),
        token: token,
      );

      setState(() {
        _answers.add(answer);
        _answerController.clear();
        _isSubmittingAnswer = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Answer posted successfully!')),
      );
    } catch (e) {
      setState(() => _isSubmittingAnswer = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error posting answer: $e')),
      );
    }
  }

  Future<void> _voteQuestion(int vote) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isSignedIn) {
      _showLoginDialog();
      return;
    }

    try {
      await ApiService.voteQuestion(
          widget.questionId, authProvider.userId!, vote);
      await _loadQuestionAndAnswers(); // Refresh to get updated vote count
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error voting: $e')),
      );
    }
  }

  Future<void> _voteAnswer(String answerId, int vote) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isSignedIn) {
      _showLoginDialog();
      return;
    }

    try {
      await ApiService.voteAnswer(answerId, authProvider.userId!, vote);
      await _loadQuestionAndAnswers(); // Refresh to get updated vote counts
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error voting: $e')),
      );
    }
  }

  Future<void> _acceptAnswer(String answerId) async {
    if (_question == null) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isSignedIn) {
      _showLoginDialog();
      return;
    }

    if (authProvider.userId != _question!.authorId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Only the question author can accept answers')),
      );
      return;
    }

    try {
      await ApiService.acceptAnswer(answerId, authProvider.userId!);
      await _loadQuestionAndAnswers(); // Refresh to get updated accepted status
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Answer accepted!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error accepting answer: $e')),
      );
    }
  }

  void _showLoginDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Login Required'),
        content:
            const Text('You need to be logged in to vote or post answers.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to login or show login modal
            },
            child: const Text('Login'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_question == null) {
      return const Scaffold(
        body: Center(child: Text('Question not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Question'),
      ),
      body: Column(
        children: [
          // Question Section
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Question Title
                Text(
                  _question!.title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),

                // Question Content
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Voting Column
                    Column(
                      children: [
                        IconButton(
                          onPressed: () => _voteQuestion(1),
                          icon: const Icon(Icons.keyboard_arrow_up),
                          color: Colors.grey,
                        ),
                        Text(
                          '${_question!.voteCount}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () => _voteQuestion(-1),
                          icon: const Icon(Icons.keyboard_arrow_down),
                          color: Colors.grey,
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),

                    // Question Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Html(data: _question!.content),
                          const SizedBox(height: 16),

                          // Tags
                          if (_question!.tags.isNotEmpty)
                            Wrap(
                              spacing: 8,
                              children: _question!.tags
                                  .map((tag) => Chip(
                                        label: Text(tag),
                                        backgroundColor: const Color(0xFF0D47A1)
                                            .withOpacity(0.1),
                                        labelStyle: const TextStyle(
                                            color: Color(0xFF0D47A1)),
                                      ))
                                  .toList(),
                            ),
                          const SizedBox(height: 16),

                          // Author and time
                          Row(
                            children: [
                              const Icon(Icons.person,
                                  size: 16, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                'Asked by ${_question!.authorName}',
                                style: const TextStyle(color: Colors.grey),
                              ),
                              const Spacer(),
                              Text(
                                '${_question!.createdAt.day}/${_question!.createdAt.month}/${_question!.createdAt.year}',
                                style: const TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Answers Section
                Text(
                  '${_answers.length} Answer${_answers.length == 1 ? '' : 's'}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),

                // Answers List
                ..._answers.map((answer) => AnswerCard(
                      answer: answer,
                      questionAuthorId: _question!.authorId,
                      onVote: (vote) => _voteAnswer(answer.id, vote),
                      onAccept: () => _acceptAnswer(answer.id),
                    )),
              ],
            ),
          ),

          // Answer Input Section
          if (Provider.of<AuthProvider>(context).isSignedIn)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border(top: BorderSide(color: Colors.grey[300]!)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Your Answer',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _answerController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Write your answer...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      ElevatedButton(
                        onPressed: _isSubmittingAnswer ? null : _submitAnswer,
                        child: _isSubmittingAnswer
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Post Answer'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class AnswerCard extends StatelessWidget {
  final Answer answer;
  final String questionAuthorId;
  final Function(int) onVote;
  final VoidCallback onAccept;

  const AnswerCard({
    super.key,
    required this.answer,
    required this.questionAuthorId,
    required this.onVote,
    required this.onAccept,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Voting Column
            Column(
              children: [
                IconButton(
                  onPressed: () => onVote(1),
                  icon: const Icon(Icons.keyboard_arrow_up),
                  color: Colors.grey,
                ),
                Text(
                  '${answer.voteCount}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => onVote(-1),
                  icon: const Icon(Icons.keyboard_arrow_down),
                  color: Colors.grey,
                ),
                if (answer.isAccepted)
                  const Icon(
                    Icons.check_circle,
                    color: Colors.green,
                    size: 24,
                  ),
              ],
            ),
            const SizedBox(width: 16),

            // Answer Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Html(data: answer.content),
                  const SizedBox(height: 16),

                  // Author and actions
                  Row(
                    children: [
                      const Icon(Icons.person, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        'Answered by ${answer.authorName}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const Spacer(),
                      if (!answer.isAccepted)
                        TextButton(
                          onPressed: onAccept,
                          child: const Text('Accept'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
